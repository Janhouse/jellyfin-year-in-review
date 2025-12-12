#!/bin/sh
# scripts/generate-env-scripts.sh
# Scans source for NEXT_PUBLIC_* vars and generates placeholder env + injection script
#
# This script is run during Docker build to:
# 1. Scan source code for process.env.NEXT_PUBLIC_* patterns
# 2. Generate .env.baked with BAKED_* placeholder values
# 3. Generate scripts/inject-env.sh for runtime injection

set -e

echo "========================================"
echo "Scanning source for NEXT_PUBLIC_* environment variables..."
echo "========================================"

# Find all NEXT_PUBLIC_* variable names in source code
# Looks for patterns like: process.env.NEXT_PUBLIC_XXX
VARS=$(grep -rohE 'process\.env\.NEXT_PUBLIC_[A-Z_]+' \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    app components lib pages src 2>/dev/null | \
    sed 's/process\.env\.//' | \
    sort -u || true)

if [ -z "$VARS" ]; then
    echo "No NEXT_PUBLIC_* variables found in source"
    echo "Creating empty .env.baked and inject-env.sh"
    touch .env.baked
    mkdir -p scripts
    cat > scripts/inject-env.sh << 'EOF'
#!/bin/sh
echo "No NEXT_PUBLIC_* variables to inject"
EOF
    chmod +x scripts/inject-env.sh
    exit 0
fi

echo "Found variables:"
echo "$VARS"
echo ""

# Generate .env.baked with placeholder values
# For URL-type variables (_URL, _SRC), use valid URL placeholders (lowercase to avoid case issues)
echo "Generating .env.baked..."
rm -f .env.baked
for VAR in $VARS; do
    # Convert var name to lowercase for URL placeholder
    VAR_LOWER=$(echo "$VAR" | tr '[:upper:]' '[:lower:]' | tr '_' '-')

    # Check if variable name suggests it's a URL
    case "$VAR" in
        *_URL|*_SRC)
            # Use a valid URL placeholder that can be parsed
            # Lowercase to match what new URL().origin produces
            echo "${VAR}=https://${VAR_LOWER}.invalid/" >> .env.baked
            ;;
        *)
            # Use simple string placeholder
            echo "${VAR}=BAKED_${VAR}" >> .env.baked
            ;;
    esac
done
echo "Contents of .env.baked:"
cat .env.baked
echo ""

# Generate injection script for runtime
echo "Generating scripts/inject-env.sh..."
mkdir -p scripts

cat > scripts/inject-env.sh << 'SCRIPT_HEADER'
#!/bin/sh
# Auto-generated script to inject runtime NEXT_PUBLIC_* values
# Generated during Docker build by generate-env-scripts.sh

echo "Injecting runtime environment variables..."

# Escape special characters for sed replacement with | delimiter
# Only need to escape: | & \
escape_for_sed() {
    printf '%s' "$1" | sed 's/[|&\]/\\&/g'
}

# Replace placeholder in all relevant files
# Searches .js, .json, .html, .rsc files in .next and public directories
replace_placeholder() {
    SEARCH="$1"
    REPLACE="$2"
    find /app/.next /app/public -type f \( -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.rsc" \) 2>/dev/null | \
        xargs sed -i "s|${SEARCH}|${REPLACE}|g" 2>/dev/null || true
}

SCRIPT_HEADER

# Add replacement commands for each variable
for VAR in $VARS; do
    # Convert var name to lowercase for URL placeholder (must match .env.baked generation)
    VAR_LOWER=$(echo "$VAR" | tr '[:upper:]' '[:lower:]' | tr '_' '-')

    # Determine the placeholder pattern based on variable type
    case "$VAR" in
        *_URL|*_SRC)
            # URL variables need two replacements:
            # 1. Full URL with trailing slash
            # 2. Origin only (no trailing slash) - for cases like new URL().origin
            PLACEHOLDER_FULL="https://${VAR_LOWER}.invalid/"
            PLACEHOLDER_ORIGIN="https://${VAR_LOWER}.invalid"

            cat >> scripts/inject-env.sh << SCRIPT_VAR
# ${VAR} (URL type - replace both full URL and origin)
if [ -n "\${${VAR}}" ]; then
    ESCAPED_VALUE=\$(escape_for_sed "\${${VAR}}")
    # Extract origin from runtime URL for origin-only replacements
    RUNTIME_ORIGIN=\$(echo "\${${VAR}}" | sed -E 's|(https?://[^/]+).*|\1|')
    ESCAPED_ORIGIN=\$(escape_for_sed "\${RUNTIME_ORIGIN}")
    echo "  Injecting ${VAR}"
    replace_placeholder "${PLACEHOLDER_FULL}" "\${ESCAPED_VALUE}"
    replace_placeholder "${PLACEHOLDER_ORIGIN}" "\${ESCAPED_ORIGIN}"
else
    echo "  Clearing ${VAR} (not set)"
    replace_placeholder "${PLACEHOLDER_FULL}" ""
    replace_placeholder "${PLACEHOLDER_ORIGIN}" ""
fi

SCRIPT_VAR
            ;;
        *)
            PLACEHOLDER="BAKED_${VAR}"

            cat >> scripts/inject-env.sh << SCRIPT_VAR
# ${VAR}
if [ -n "\${${VAR}}" ]; then
    ESCAPED_VALUE=\$(escape_for_sed "\${${VAR}}")
    echo "  Injecting ${VAR}"
    replace_placeholder "${PLACEHOLDER}" "\${ESCAPED_VALUE}"
else
    echo "  Clearing ${VAR} (not set)"
    replace_placeholder "${PLACEHOLDER}" ""
fi

SCRIPT_VAR
            ;;
    esac
done

# Add completion message
cat >> scripts/inject-env.sh << 'SCRIPT_FOOTER'
echo "Environment variable injection complete"
SCRIPT_FOOTER

chmod +x scripts/inject-env.sh
echo ""
echo "========================================"
echo "Done! Generated:"
echo "  - .env.baked (placeholder values for build)"
echo "  - scripts/inject-env.sh (runtime injection)"
echo "========================================"
