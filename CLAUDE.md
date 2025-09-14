# Workflow
- When making changes or installing libs or checking logs or any other cases always do with docker containers.
The project is build as docker compose services, conduct all the debugging and tracebacking in docker container.
- Always write all information, explanations, and instructions in Russian. Code itself must remain in English, but comments in the code should be in Russian.
- For every code block you provide, add Russian comments inside the code explaining what each part does. This will make it easier to search and understand later.
- When adding new API services, always use the single source of authorization settings (api/index.ts).
Do not create duplicate methods for refresh/access tokens.
All requests must go through the common API layer to avoid inconsistencies.
- все библиотеки и новые создаваемые библиотеки должны быть включены в requirements.txt