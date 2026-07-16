import sys
from loguru import logger

# Configure Loguru standard logging to stdout
logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Custom Audit Logger configured for immutable storage audit trials
audit_logger = logger.bind(audit=True)
logger.add(
    "audit_logs.log",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {message}",
    filter=lambda record: "audit" in record["extra"],
    rotation="10 MB"
)
