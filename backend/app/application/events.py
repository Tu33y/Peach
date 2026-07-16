import time
from typing import Dict, Any, List, Callable
from app.core.logging import logger

# Simple in-app Event Bus
class EventBus:
    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def publish(self, event_type: str, data: Any):
        logger.info(f"Publishing event {event_type} with payload {data}")
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                try:
                    handler(data)
                except Exception as e:
                    logger.error(f"Error handling event {event_type}: {str(e)}")

event_bus = EventBus()

# Event Handler definitions
def handle_order_created(data):
    # E.g. lock payments or create audit trail or send user notification
    logger.info(f"EVENT_HANDLER [OrderCreated] for order {data.get('order_id')}")

def handle_payment_locked(data):
    logger.info(f"EVENT_HANDLER [PaymentLocked] for order {data.get('order_id')}")

def handle_order_completed(data):
    logger.info(f"EVENT_HANDLER [OrderCompleted] for order {data.get('order_id')}")

def handle_review_created(data):
    logger.info(f"EVENT_HANDLER [ReviewCreated] for review {data.get('review_id')}")

# Register listeners
event_bus.subscribe("OrderCreated", handle_order_created)
event_bus.subscribe("PaymentLocked", handle_payment_locked)
event_bus.subscribe("OrderCompleted", handle_order_completed)
event_bus.subscribe("ReviewCreated", handle_review_created)
