.DEFAULT_GOAL := help

CLASP = npx @google/clasp

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.clasp.json:
	make login
	$(CLASP) create --title openai-slack-bot --type webapp --rootDir ./src
	mv src/.clasp.json .
	$(CLASP) setting fileExtension ts
	# $(CLASP) setting filePushOrder
	sed -i -e 's/}/,"filePushOrder":["src\/OAuth2Handler.ts","src\/SlackBaseHandler.ts","src\/BaseError.ts"]}/' .clasp.json
	rm -f .clasp.json-e

node_modules:
	npm ci

.PHONY: login
login: ## Google login
login:
	$(CLASP) login

.PHONY: push
push: ## Push Google apps scripts
push: .clasp.json lint
	$(CLASP) push -f

.PHONY: deploy
deploy: ## Deploy Google apps scripts
deploy: .clasp.json
	$(CLASP) deploy -d "`npx -c 'echo \"$$npm_package_version\"'`"

.PHONY: redeploy
redeploy: ## Re-Deploy Google apps scripts
redeploy: .clasp.json
	$(CLASP) deploy --versionNumber `$(CLASP) versions | grep -o '^[0-9]*' | tail -n 1` -d "`npx -c 'echo \"$$npm_package_version\"'`"

.PHONY: open
open: ## Open Google apps scripts
open: .clasp.json
	$(CLASP) open

.PHONY: application
application: ## Open web application
application: .clasp.json
	$(CLASP) open --webapp

.PHONY: pull
pull: ## Pull Google apps scripts
pull: .clasp.json
	$(CLASP) pull

.PHONY: lint
lint: ## Run tslint
lint: node_modules
	npm run lint

.PHONY: test
test: ## Run jest
test: node_modules
	npm test

.PHONY: undeploy
undeploy: ## all undeploy Google apps scripts
undeploy:
	$(CLASP) undeploy --all

.PHONY: npm-check-updates
npm-check-updates: ## npm check updates
npm-check-updates:
	npx npm-check-updates -u