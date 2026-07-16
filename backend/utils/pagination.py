# utils/pagination.py - Pagination utilities
def paginate_results(results, page=1, limit=20):
    """Paginate results with metadata"""
    total = len(results)
    start = (page - 1) * limit
    end = start + limit
    
    paginated_results = results[start:end]
    
    return {
        'data': paginated_results,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'pages': (total + limit - 1) // limit,  # Ceiling division
            'has_next': end < total,
            'has_prev': start > 0
        }
    }