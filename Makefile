DETERMINISTIC_DATETIME=202301010000
TOUCH=find . -exec touch -t ${DETERMINISTIC_DATETIME} {} +
ROOT_DIR=$(shell pwd)

clean:
	rm -rf dist
	rm -rf staging

lint:
	npx eslint --ext .ts .

format:
	npx prettier --write .

test:
	npx run test

build:
	npx ts-node ./build.mjs

bundle-layers:
	mkdir -p dist/layers;
	cd staging/layers; \
	for d in *; do cd "$$d" && ${TOUCH} && zip -oXr "$$d" . && mv "$$d.zip" "${ROOT_DIR}/dist/layers" && cd ../; done;	

bundle-functions:
	mkdir -p dist/functions;
	cd staging/functions; \
	for d in *; do cd "$$d" && ${TOUCH} && zip -oXr "$$d" . && mv "$$d.zip" "${ROOT_DIR}/dist/functions" && cd ../; done;

bundle: bundle-layers bundle-functions

synth:
	npx cdktf synth

plan:
	npx cdktf diff

deploy:
	npx cdktf deploy

destroy:
	npx cdktf destroy
