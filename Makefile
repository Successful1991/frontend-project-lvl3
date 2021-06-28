develop:
	npx webpack serve

install:
	npm install

prettier:
	npx prettier --write src
test:
	npm test --watch

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint --fix --fix-type suggestion,layout .
