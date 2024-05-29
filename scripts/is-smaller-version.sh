#!/bin/bash

# Given version
version="$2"

# Version to compare
compare_version="$1"

# Remove the leading 'v' if it exists
compare_version=$(echo "$compare_version" | sed 's/^v//')

# echo "compare_version: ${compare_version}"

# Function to execute if the version is less than the given version
function do_something {
  echo "IS_LESS=1"
  exit 0
}

# Function to execute if the version is not less than the given version
function do_something_else {
  echo "IS_LESS=0"
  exit 0
}

# Split the version numbers into arrays
IFS='.' read -r -a version_parts <<< "$version"
IFS='.' read -r -a compare_version_parts <<< "$compare_version"

# Compare major version
if [[ ${compare_version_parts[0]} -lt ${version_parts[0]} ]]; then
  do_something
elif [[ ${compare_version_parts[0]} -gt ${version_parts[0]} ]]; then
  do_something_else
else
  # Major version is the same, compare minor version
  if [[ ${compare_version_parts[1]} -lt ${version_parts[1]} ]]; then
    do_something
  elif [[ ${compare_version_parts[1]} -gt ${version_parts[1]} ]]; then
    do_something_else
  else
    # Minor version is the same, compare patch version
    if [[ ${compare_version_parts[2]} -lt ${version_parts[2]} ]]; then
      do_something
    else
      do_something_else
    fi
  fi
fi
