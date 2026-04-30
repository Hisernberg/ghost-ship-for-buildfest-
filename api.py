"""GhostShip API entrypoint."""

import os

from ghostship.api import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))
    host = os.environ.get("HOST", "0.0.0.0")
    app.run(host=host, port=port, debug=False)
