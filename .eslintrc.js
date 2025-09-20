module.exports = {
  root: true,
  extends: ["@react-native-community", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "react-native",
    "import",
    "prettier",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2024,
    sourceType: "module",
  },
  env: {
    "react-native/react-native": true,
  },
  rules: {
    // Import sorting rules
    "import/order": [
      "error",
      {
        groups: [
          "builtin", // Node.js встроенные модули
          "external", // npm пакеты
          "internal", // внутренние модули
          "parent", // ../
          "sibling", // ./
          "index", // ./index
          "type", // type imports
        ],
        pathGroups: [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
          {
            pattern: "react-native",
            group: "external",
            position: "before",
          },
          {
            pattern: "expo",
            group: "external",
            position: "before",
          },
          {
            pattern: "expo-*",
            group: "external",
            position: "before",
          },
          {
            pattern: "{@livekit/**,livekit-*}",
            group: "external",
            position: "after",
          },
          {
            pattern: "./components/**",
            group: "sibling",
            position: "after",
          },
          {
            pattern: "./types/**",
            group: "sibling",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["react", "react-native"],
        "newlines-between": "ignore",
        warnOnUnassignedImports: true,
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
    "import/first": "error",

    // React Native specific rules
    "react-native/no-unused-styles": "error",
    "react-native/split-platform-components": "error",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    "react-native/no-raw-text": "error",
    "react-native/no-single-element-style-arrays": "error",

    // React rules
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // TypeScript rules
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-function": "off",

    // Prettier rules
    "prettier/prettier": "error",

    // General rules
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-arrow-callback": "error",
    "no-unused-vars": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
      },
    },
    "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
  },
  ignorePatterns: [
    "node_modules/",
    "android/",
    "ios/",
    ".expo/",
    "dist/",
    "build/",
    "*.d.ts",
  ],
}
