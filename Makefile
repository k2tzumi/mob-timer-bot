.DEFAULT_GOAL := help

CLASP = npx @google/clasp

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.clasp.json:
	make login
	$(CLASP) create-script --title mob-timer-bot --rootDir ./dist

dist/Code.js:
	make build

node_modules:
	npm install

.PHONY: install
install: ## Install packages
install: node_modules

.PHONY: upgrade
upgrade: ## Upgrades package.json
upgrade:
	npx -p npm-check-updates -c "ncu -u"
	npm update

.PHONY: login
login: ## Google login
login:
	$(CLASP) login

.PHONY: build
build: ## Build Google apps scripts
build: node_modules lint
	npm run build

.PHONY: push
push: ## Push Google apps scripts
push: .clasp.json dist/Code.js
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
lint: ## Run ESLint
lint: node_modules
	npm run lint

.PHONY: format
format: ## Run Prettier format
format: node_modules
	npm run format

.PHONY: test
test: ## Run jest
test: node_modules
	npm test

.PHONY: clean
clean: ## clean rollup bundle
clean:
	rm -f dist/Code.js*

.PHONY: undeploy
undeploy: ## all undeploy Google apps scripts
undeploy:
	$(CLASP) undeploy --all

.PHONY: npm-check-updates
npm-check-updates: ## npm check updates
npm-check-updates:
	npx npm-check-updates -u
