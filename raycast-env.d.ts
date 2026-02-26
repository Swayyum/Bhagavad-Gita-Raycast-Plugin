/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Color Scheme - Choose your preferred color scheme for icons */
  "colorScheme": "blue" | "green" | "purple" | "orange" | "red",
  /** Show Sanskrit - Display original Sanskrit verses when available */
  "showSanskrit": boolean,
  /** API Source - Select the source for Bhagavad Gita data */
  "apiSource": "vedic" | "gita",
  /** RapidAPI Key - Required only if using RapidAPI source */
  "apiKey"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
  /** Preferences accessible in the `ask-gita` command */
  export type AskGita = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
  /** Arguments passed to the `ask-gita` command */
  export type AskGita = {}
}

