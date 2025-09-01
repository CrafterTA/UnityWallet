"""Transaction service business logic."""

from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from ..common.models import Transaction, TransactionType, TransactionStatus, AuditAction, AuditStatus
from ..common.audit import write_audit
from ..common.logging import get_logger
from .schema import TransactionSearchRequest, TransactionResponse, PaginationMeta, TransactionListResponse

logger = get_logger("transactions_service")


class TransactionService:
    """Service for transaction history and search operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_transaction_by_id(
        self, 
        user_id: str, 
        transaction_id: str,
        correlation_id: Optional[str] = None
    ) -> Optional[TransactionResponse]:
        """Get a specific transaction by ID for the authenticated user."""
        try:
            # Validate UUID format
            try:
                UUID(transaction_id)
                UUID(user_id)
            except ValueError:
                logger.warning(f"Invalid UUID format", extra={
                    "user_id": user_id,
                    "transaction_id": transaction_id,
                    "correlation_id": correlation_id
                })
                return None
            
            # Query transaction with user authorization
            transaction = (
                self.db.query(Transaction)
                .filter(
                    and_(
                        Transaction.id == transaction_id,
                        Transaction.user_id == user_id
                    )
                )
                .first()
            )
            
            if not transaction:
                logger.info(f"Transaction not found", extra={
                    "user_id": user_id,
                    "transaction_id": transaction_id,
                    "correlation_id": correlation_id
                })
                return None
            
            # Log successful access
            write_audit(
                db=self.db,
                action=AuditAction.READ,
                resource="transaction",
                resource_id=transaction_id,
                status=AuditStatus.SUCCESS,
                user_id=user_id,
                request_id=correlation_id,
                meta={"action_type": "get_transaction_by_id"}
            )
            
            # Convert UUID to string for response
            return TransactionResponse(
                id=str(transaction.id),
                tx_type=str(transaction.tx_type.value),
                asset_code=transaction.asset_code,
                amount=transaction.amount,
                status=str(transaction.status.value),
                created_at=transaction.created_at,
                stellar_tx_hash=transaction.stellar_tx_hash,
                destination=transaction.destination,
                memo=transaction.memo,
                sell_asset=transaction.sell_asset,
                buy_asset=transaction.buy_asset,
                rate=transaction.rate
            )
            
        except Exception as e:
            logger.error(f"Error retrieving transaction", extra={
                "user_id": user_id,
                "transaction_id": transaction_id,
                "error": str(e),
                "correlation_id": correlation_id
            })
            
            # Log failed access
            write_audit(
                db=self.db,
                action=AuditAction.READ,
                resource="transaction", 
                resource_id=transaction_id,
                status=AuditStatus.ERROR,
                user_id=user_id,
                request_id=correlation_id,
                meta={"error": str(e), "action_type": "get_transaction_by_id"}
            )
            raise
    
    def search_transactions(
        self, 
        user_id: str, 
        search_params: TransactionSearchRequest,
        correlation_id: Optional[str] = None
    ) -> TransactionListResponse:
        """Search and filter transactions with pagination."""
        try:
            # Validate user ID
            try:
                UUID(user_id)
            except ValueError:
                raise ValueError("Invalid user ID format")
            
            # Build base query with user authorization
            base_query = self.db.query(Transaction).filter(Transaction.user_id == user_id)
            
            # Apply filters
            filtered_query = self._apply_filters(base_query, search_params)
            
            # Get total count for pagination
            total_count = filtered_query.count()
            
            # Apply sorting
            sorted_query = self._apply_sorting(filtered_query, search_params)
            
            # Apply pagination
            offset = (search_params.page - 1) * search_params.per_page
            transactions_query = sorted_query.offset(offset).limit(search_params.per_page)
            
            # Execute query
            transactions = transactions_query.all()
            
            # Create pagination metadata
            total_pages = (total_count + search_params.per_page - 1) // search_params.per_page
            pagination = PaginationMeta(
                page=search_params.page,
                per_page=search_params.per_page,
                total_count=total_count,
                total_pages=total_pages,
                has_next=search_params.page < total_pages,
                has_prev=search_params.page > 1
            )
            
            # Convert to response models with UUID to string conversion
            transaction_responses = []
            for tx in transactions:
                response = TransactionResponse(
                    id=str(tx.id),
                    tx_type=str(tx.tx_type.value),
                    asset_code=tx.asset_code,
                    amount=tx.amount,
                    status=str(tx.status.value),
                    created_at=tx.created_at,
                    stellar_tx_hash=tx.stellar_tx_hash,
                    destination=tx.destination,
                    memo=tx.memo,
                    sell_asset=tx.sell_asset,
                    buy_asset=tx.buy_asset,
                    rate=tx.rate
                )
                transaction_responses.append(response)
            
            # Log successful search
            write_audit(
                db=self.db,
                action=AuditAction.READ,
                resource="transaction",
                resource_id=None,
                status=AuditStatus.SUCCESS,
                user_id=user_id,
                request_id=correlation_id,
                meta={
                    "action_type": "search_transactions",
                    "filters": search_params.dict(exclude_unset=True),
                    "result_count": len(transactions),
                    "total_count": total_count
                }
            )
            
            logger.info(f"Transaction search completed", extra={
                "user_id": user_id,
                "result_count": len(transactions),
                "total_count": total_count,
                "page": search_params.page,
                "correlation_id": correlation_id
            })
            
            return TransactionListResponse(
                transactions=transaction_responses,
                pagination=pagination
            )
            
        except Exception as e:
            logger.error(f"Error searching transactions", extra={
                "user_id": user_id,
                "search_params": search_params.dict(exclude_unset=True),
                "error": str(e),
                "correlation_id": correlation_id
            })
            
            # Log failed search
            write_audit(
                db=self.db,
                action=AuditAction.READ,
                resource="transaction",
                resource_id=None,
                status=AuditStatus.ERROR,
                user_id=user_id,
                request_id=correlation_id,
                meta={
                    "error": str(e),
                    "action_type": "search_transactions",
                    "filters": search_params.dict(exclude_unset=True)
                }
            )
            raise
    
    def _apply_filters(self, query, search_params: TransactionSearchRequest):
        """Apply search filters to the query."""
        # Transaction type filter
        if search_params.tx_type:
            query = query.filter(Transaction.tx_type == TransactionType(search_params.tx_type.value))
        
        # Status filter
        if search_params.status:
            query = query.filter(Transaction.status == TransactionStatus(search_params.status.value))
        
        # Asset code filter
        if search_params.asset_code:
            query = query.filter(Transaction.asset_code == search_params.asset_code)
        
        # Date range filters
        if search_params.from_date:
            query = query.filter(Transaction.created_at >= search_params.from_date)
        
        if search_params.to_date:
            query = query.filter(Transaction.created_at <= search_params.to_date)
        
        # Amount range filters
        if search_params.min_amount is not None:
            query = query.filter(Transaction.amount >= search_params.min_amount)
        
        if search_params.max_amount is not None:
            query = query.filter(Transaction.amount <= search_params.max_amount)
        
        # Text search in memo, destination, or transaction hash
        if search_params.search_query:
            search_term = f"%{search_params.search_query}%"
            query = query.filter(
                or_(
                    Transaction.memo.ilike(search_term),
                    Transaction.destination.ilike(search_term),
                    Transaction.stellar_tx_hash.ilike(search_term)
                )
            )
        
        return query
    
    def _apply_sorting(self, query, search_params: TransactionSearchRequest):
        """Apply sorting to the query."""
        sort_field = getattr(Transaction, search_params.sort_by, Transaction.created_at)
        
        if search_params.sort_order == "desc":
            return query.order_by(desc(sort_field))
        else:
            return query.order_by(asc(sort_field))
    
    def get_transaction_summary(
        self, 
        user_id: str,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get transaction summary statistics for the user."""
        try:
            # Validate user ID
            try:
                UUID(user_id)
            except ValueError:
                raise ValueError("Invalid user ID format")
            
            # Get transaction counts by type
            type_counts = (
                self.db.query(
                    Transaction.tx_type,
                    func.count(Transaction.id).label('count'),
                    func.sum(Transaction.amount).label('total_amount')
                )
                .filter(Transaction.user_id == user_id)
                .group_by(Transaction.tx_type)
                .all()
            )
            
            # Get status counts
            status_counts = (
                self.db.query(
                    Transaction.status,
                    func.count(Transaction.id).label('count')
                )
                .filter(Transaction.user_id == user_id)
                .group_by(Transaction.status)
                .all()
            )
            
            # Get total transaction count
            total_transactions = (
                self.db.query(func.count(Transaction.id))
                .filter(Transaction.user_id == user_id)
                .scalar()
            )
            
            summary = {
                "total_transactions": total_transactions,
                "by_type": {
                    str(tc.tx_type.value): {
                        "count": tc.count,
                        "total_amount": float(tc.total_amount) if tc.total_amount else 0
                    }
                    for tc in type_counts
                },
                "by_status": {
                    str(sc.status.value): sc.count
                    for sc in status_counts
                }
            }
            
            # Log successful summary generation
            write_audit(
                db=self.db,
                action=AuditAction.READ,
                resource="transaction",
                resource_id=None,
                status=AuditStatus.SUCCESS,
                user_id=user_id,
                request_id=correlation_id,
                meta={
                    "action_type": "get_transaction_summary",
                    "total_count": total_transactions
                }
            )
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating transaction summary", extra={
                "user_id": user_id,
                "error": str(e),
                "correlation_id": correlation_id
            })
            
            # Log failed summary generation
            write_audit(
                db=self.db,
                action=AuditAction.READ,
                resource="transaction",
                resource_id=None,
                status=AuditStatus.ERROR,
                user_id=user_id,
                request_id=correlation_id,
                meta={
                    "error": str(e),
                    "action_type": "get_transaction_summary"
                }
            )
            raise