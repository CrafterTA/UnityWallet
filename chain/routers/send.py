from fastapi import APIRouter
from chain.models.schemas import SendEstimateReq, SendExecReq
from chain.services.payments import estimate_payment_fee, execute_payment

router = APIRouter(prefix="/send", tags=["send"])

@router.post("/estimate")
def estimate(body: SendEstimateReq):
    fee_stroops = estimate_payment_fee(op_count=1)
    return {
        "estimated_base_fee_stroops": fee_stroops,
        "note": "Actual fee_charged is returned in tx result."
    }

@router.post("/execute")
def execute(body: SendExecReq):
    return execute_payment(body.secret, body.destination, body.source, body.amount)
