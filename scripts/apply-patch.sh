#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR/../node_modules/typedoc/dist/lib/serialization/serializers/sources

patch -N < $DIR/typedoc-url.patch 
