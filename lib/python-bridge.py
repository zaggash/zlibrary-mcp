#!/usr/bin/env python3
import sys
import json
import traceback
import asyncio
from zlibrary import AsyncZlib, Extension, Language

# Global zlibrary client
zlib_client = None

async def initialize_client():
    global zlib_client
    
    # Load credentials from environment variables or config file
    import os
    email = os.environ.get('ZLIBRARY_EMAIL')
    password = os.environ.get('ZLIBRARY_PASSWORD')
    
    if not email or not password:
        raise Exception("ZLIBRARY_EMAIL and ZLIBRARY_PASSWORD environment variables must be set")
    
    # Initialize the AsyncZlib client
    zlib_client = AsyncZlib()
    await zlib_client.login(email, password)
    return zlib_client

async def search(query, exact=False, from_year=None, to_year=None, languages=None, extensions=None, count=10):
    """Search for books based on title, author, etc."""
    if not zlib_client:
        await initialize_client()
        
    # Convert language strings to Language enum values
    langs = []
    if languages:
        for lang in languages:
            try:
                langs.append(getattr(Language, lang.upper()))
            except AttributeError:
                langs.append(lang)
    
    # Convert extension strings to Extension enum values
    exts = []
    if extensions:
        for ext in extensions:
            try:
                exts.append(getattr(Extension, ext.upper()))
            except AttributeError:
                exts.append(ext)
    
    # Execute the search
    paginator = await zlib_client.search(
        q=query,
        exact=exact,
        from_year=from_year,
        to_year=to_year,
        lang=langs,
        extensions=exts,
        count=count
    )
    
    # Get the first page of results
    results = await paginator.next()
    return results

async def get_by_id(book_id):
    """Get book details by ID"""
    if not zlib_client:
        await initialize_client()
        
    return await zlib_client.get_by_id(id=book_id)

async def get_download_info(book_id, format=None):
    """
    Get book info including download URL
    This accurately represents what the function does - it gets book info with a download URL,
    not actually downloading the file content
    """
    if not zlib_client:
        await initialize_client()
    
    # Get book details
    book = await zlib_client.get_by_id(id=book_id)
    
    return {
        'title': book.get('name', f"book_{book_id}"),
        'author': book.get('author', 'Unknown'),
        'format': format or book.get('extension', 'pdf'),
        'filesize': book.get('size', 'Unknown'),
        'download_url': book.get('download_url')
    }

async def full_text_search(query, exact=False, phrase=True, words=False, languages=None, extensions=None, count=10):
    """Search for text within book contents"""
    if not zlib_client:
        await initialize_client()
        
    # Convert language strings to Language enum values
    langs = []
    if languages:
        for lang in languages:
            try:
                langs.append(getattr(Language, lang.upper()))
            except AttributeError:
                langs.append(lang)
    
    # Convert extension strings to Extension enum values
    exts = []
    if extensions:
        for ext in extensions:
            try:
                exts.append(getattr(Extension, ext.upper()))
            except AttributeError:
                exts.append(ext)
    
    # Execute the search
    paginator = await zlib_client.full_text_search(
        q=query,
        exact=exact,
        phrase=phrase,
        words=words,
        lang=langs,
        extensions=exts,
        count=count
    )
    
    # Get the first page of results
    results = await paginator.next()
    return results

async def get_download_history(count=10):
    """Get user's download history"""
    if not zlib_client:
        await initialize_client()
        
    # Get download history paginator
    history_paginator = await zlib_client.profile.download_history()
    
    # Get first page of history
    history = history_paginator.result
    return history

async def get_download_limits():
    """Get user's download limits"""
    if not zlib_client:
        await initialize_client()
        
    limits = await zlib_client.profile.get_limits()
    return limits

async def get_recent_books(count=10, format=None):
    """Get recent books via search"""
    if not zlib_client:
        await initialize_client()
    
    # We'll do a general search and sort by newest
    paginator = await zlib_client.search(q="", count=count)
    
    # Get the first page of results
    results = await paginator.next()
    return results

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        return 1
    
    function_name = sys.argv[1]
    args_json = sys.argv[2]
    
    try:
        args = json.loads(args_json)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON arguments"}))
        return 1
    
    try:
        # Map function name to async function - using accurately named functions
        function_map = {
            'search': search,
            'get_by_id': get_by_id,
            'get_download_info': get_download_info,  # Renamed to accurately reflect behavior
            'full_text_search': full_text_search,
            'get_download_history': get_download_history,
            'get_download_limits': get_download_limits,
            'get_recent_books': get_recent_books
        }
        
        if function_name not in function_map:
            print(json.dumps({"error": f"Unknown function: {function_name}"}))
            return 1
        
        # Execute the async function and get result
        result = asyncio.run(function_map[function_name](*args))
        
        # Output the result as JSON
        print(json.dumps(result))
        return 0
    
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        }))
        return 1

if __name__ == "__main__":
    sys.exit(main())