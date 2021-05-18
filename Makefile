develop:
	npx webpack serve

install:
	npm install

build:
	rm -rf dist
    NODE_ENV=production npx webpack

test:
	npm test --watch

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .
