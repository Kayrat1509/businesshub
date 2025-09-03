import json

from django.utils.deprecation import MiddlewareMixin

from app.logs.models import ActionLog


class ActionLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if (
            request.user.is_authenticated
            and request.method in ["POST", "PUT", "PATCH", "DELETE"]
            and response.status_code < 400
        ):
            try:
                payload = {
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                }

                ActionLog.objects.create(
                    user=request.user,
                    action=f"{request.method} {request.path}",
                    entity_type="HTTP_REQUEST",
                    entity_id=None,
                    payload=payload,
                )
            except Exception:
                pass

        return response
