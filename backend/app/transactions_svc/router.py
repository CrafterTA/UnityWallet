"""Transaction service API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.middleware import get_correlation_id
from ..common.logging import get_logger
from .schema import (
    TransactionResponse, 
    TransactionListResponse, 
    TransactionSearchRequest
)
from .service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])
logger = get_logger("transactions_router")


@router.get("/", response_model=TransactionListResponse)
async def get_transactions(
    # Pagination parameters
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
    
    # Filter parameters  
    tx_type: Optional[str] = Query(default=None, description="Filter by transaction type"),
    status: Optional[str] = Query(default=None, description="Filter by transaction status"),
    asset_code: Optional[str] = Query(default=None, description="Filter by asset code"),
    
    # Date range parameters
    from_date: Optional[str] = Query(default=None, description="Filter from date (ISO format)"),
    to_date: Optional[str] = Query(default=None, description="Filter to date (ISO format)"),
    
    # Amount range parameters
    min_amount: Optional[float] = Query(default=None, ge=0, description="Minimum amount filter"),
    max_amount: Optional[float] = Query(default=None, ge=0, description="Maximum amount filter"),
    
    # Text search parameter
    search_query: Optional[str] = Query(default=None, description="Search in memo, destination, or hash"),
    
    # Sorting parameters
    sort_by: Optional[str] = Query(default="created_at", pattern="^(created_at|amount)$", description="Sort field"),
    sort_order: Optional[str] = Query(default="desc", pattern="^(asc|desc)$", description="Sort order"),
    
    # Dependencies
    current_user=Depends(get_current_user),
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Get paginated list of user transactions with optional filtering and search."""
    try:
        # Create search request from query parameters
        search_params = TransactionSearchRequest(
            page=page,
            per_page=per_page,
            tx_type=tx_type,
            status=status,
            asset_code=asset_code,
            from_date=from_date,
            to_date=to_date,
            min_amount=min_amount,
            max_amount=max_amount,
            search_query=search_query,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        service = TransactionService(db)
        result = service.search_transactions(
            user_id=str(current_user.id),
            search_params=search_params,
            correlation_id=correlation_id
        )
        
        logger.info(f"Transaction list request successful", extra={
            "user_id": str(current_user.id),
            "page": page,
            "per_page": per_page,
            "result_count": len(result.transactions),
            "total_count": result.pagination.total_count,
            "correlation_id": correlation_id
        })
        
        return result
        
    except ValueError as e:
        logger.warning(f"Invalid transaction list request", extra={
            "user_id": str(current_user.id),
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Transaction list request failed", extra={
            "user_id": str(current_user.id),
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/search", response_model=TransactionListResponse)
async def search_transactions(
    request: TransactionSearchRequest = Depends(),
    current_user=Depends(get_current_user),
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Advanced transaction search with comprehensive filtering options."""
    try:
        service = TransactionService(db)
        result = service.search_transactions(
            user_id=str(current_user.id),
            search_params=request,
            correlation_id=correlation_id
        )
        
        logger.info(f"Transaction search request successful", extra={
            "user_id": str(current_user.id),
            "search_params": request.dict(exclude_unset=True),
            "result_count": len(result.transactions),
            "total_count": result.pagination.total_count,
            "correlation_id": correlation_id
        })
        
        return result
        
    except ValueError as e:
        logger.warning(f"Invalid transaction search request", extra={
            "user_id": str(current_user.id),
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Transaction search request failed", extra={
            "user_id": str(current_user.id),
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/summary")
async def get_transaction_summary(
    current_user=Depends(get_current_user),
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Get transaction summary statistics for the user."""
    try:
        service = TransactionService(db)
        summary = service.get_transaction_summary(
            user_id=str(current_user.id),
            correlation_id=correlation_id
        )
        
        logger.info(f"Transaction summary request successful", extra={
            "user_id": str(current_user.id),
            "total_transactions": summary.get("total_transactions", 0),
            "correlation_id": correlation_id
        })
        
        return summary
        
    except ValueError as e:
        logger.warning(f"Invalid transaction summary request", extra={
            "user_id": str(current_user.id),
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Transaction summary request failed", extra={
            "user_id": str(current_user.id),
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user=Depends(get_current_user),
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID."""
    try:
        service = TransactionService(db)
        transaction = service.get_transaction_by_id(
            user_id=str(current_user.id),
            transaction_id=transaction_id,
            correlation_id=correlation_id
        )
        
        if not transaction:
            logger.warning(f"Transaction not found", extra={
                "user_id": str(current_user.id),
                "transaction_id": transaction_id,
                "correlation_id": correlation_id
            })
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        logger.info(f"Transaction retrieval successful", extra={
            "user_id": str(current_user.id),
            "transaction_id": transaction_id,
            "correlation_id": correlation_id
        })
        
        return transaction
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
        
    except ValueError as e:
        logger.warning(f"Invalid transaction retrieval request", extra={
            "user_id": str(current_user.id),
            "transaction_id": transaction_id,
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Transaction retrieval failed", extra={
            "user_id": str(current_user.id),
            "transaction_id": transaction_id,
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")