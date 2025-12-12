/**
 * Theme utilities for the application
 */

import colors from "./colors.js"

/**
 * Get a color value from the theme
 * @param {string} path - Path to the color (e.g., 'primary.500', 'background.DEFAULT')
 * @returns {string} - The color value
 */
function getColor(path) {
  const parts = path.split(".")
  let result = colors

  for (const part of parts) {
    if (result[part] === undefined) {
      console.warn(`Color path "${path}" not found in theme`)
      return null
    }
    result = result[part]
  }

  return result
}

/**
 * Get a CSS variable for a color
 * @param {string} path - Path to the color
 * @returns {string} - CSS variable reference
 */
function getCssVar(path) {
  // Convert path like 'primary.500' to '--primary-500'
  const cssVar = "--" + path.replace(".", "-")
  return `var(${cssVar})`
}

export { colors, getColor, getCssVar }
export default { colors, getColor, getCssVar }
