import requests
import logging
import re
from typing import Dict, Optional, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("federal-register-tool")

def get_federal_register_document(document_number: str) -> Optional[Dict]:
    """Fetches document details from Federal Register API"""
    url = f"https://www.federalregister.gov/api/v1/documents/{document_number}.json"
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        data = response.json()
        return {
            "document_number": data.get("document_number"),
            "title": data.get("title"),
            "date": data.get("publication_date"),
            "type": data.get("document_type"),
            "html_url": data.get("html_url"),
            "full_text": data.get("body_html", data.get("raw_text_url")),
            "abstract": data.get("abstract"),
            "agencies": [agency.get("name") for agency in data.get("agencies", [])],
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"HTTP error: {e}")
    except Exception as e:
        logger.error(f"Error querying Federal Register: {e}")
    return None

def search_executive_orders(executive_order_number: str) -> List[Dict]:
    """Searches Federal Register for specific executive order"""
    url = "https://www.federalregister.gov/api/v1/documents.json"
    params = {
        "conditions[type]": "PRESDOCU",
        "conditions[presidential_document_type]": "executive_order",
        "conditions[term]": f"Executive Order {executive_order_number}",
        "per_page": 10,
        "fields[]": ["document_number", "title", "publication_date", "html_url", "executive_order_number"]
    }
    
    try:
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        logger.error(f"Error searching executive orders: {e}")
        return []

def get_executive_order_status(executive_order_number: str) -> Optional[Dict]:
    """Retrieves comprehensive status of executive order including amendments and repeals"""
    try:
        cleaned_number = re.sub(r'\D', '', str(executive_order_number))
        logger.info(f"Searching for Executive Order {cleaned_number}")
        
        search_results = search_executive_orders(cleaned_number)
        
        if not search_results:
            search_results = _perform_general_search(cleaned_number)
        
        if not search_results:
            logger.warning(f"No results found for EO {cleaned_number}")
            return _create_not_found_response(cleaned_number)
        
        original_order = search_results[0]
        
        order_info = {
            "number": cleaned_number,
            "title": original_order.get("title", "Unknown"),
            "date": original_order.get("publication_date", "Unknown"),
            "status": "Active",
            "html_url": original_order.get("html_url"),
            "amendments": [],
            "repealed": []
        }
        
        _check_for_modifications(cleaned_number, order_info)
        
        return order_info
        
    except Exception as e:
        logger.error(f"Error getting EO status: {e}")
        return None

def _perform_general_search(executive_order_number: str) -> List[Dict]:
    """Performs broader search when specific EO search fails"""
    url = "https://www.federalregister.gov/api/v1/documents.json"
    params = {
        "conditions[term]": f"{executive_order_number}",
        "per_page": 5
    }
    
    try:
        response = requests.get(url, params=params, timeout=20)
        if response.status_code == 200:
            data = response.json()
            return data.get("results", [])
    except Exception as e:
        logger.error(f"General search failed: {e}")
    return []

def _create_not_found_response(executive_order_number: str) -> Dict:
    """Creates standardized response for unfound executive orders"""
    return {
        "number": executive_order_number,
        "title": "Unknown",
        "date": "Unknown",
        "status": "Not found in Federal Register",
        "html_url": None,
        "amendments": [],
        "repealed": []
    }

def _check_for_modifications(executive_order_number: str, order_info: Dict) -> None:
    """Searches for amendments or repeals of the executive order"""
    url = "https://www.federalregister.gov/api/v1/documents.json"
    params = {
        "conditions[term]": f'"Executive Order {executive_order_number}" AND (amend OR revoke OR repeal)',
        "conditions[type]": "PRESDOCU",
        "per_page": 20,
        "fields[]": ["document_number", "title", "publication_date", "executive_order_number"]
    }
    
    try:
        response = requests.get(url, params=params, timeout=20)
        if response.status_code == 200:
            data = response.json()
            for document in data.get("results", []):
                document_title = document.get("title", "").lower()
                modification_info = {
                    "document": document.get("document_number"),
                    "title": document.get("title"),
                    "date": document.get("publication_date")
                }
                
                if "revok" in document_title or "repeal" in document_title:
                    order_info["status"] = "Repealed"
                    order_info["repealed"].append(modification_info)
                elif "amend" in document_title:
                    order_info["amendments"].append(modification_info)
    except Exception as e:
        logger.error(f"Error checking for modifications: {e}")