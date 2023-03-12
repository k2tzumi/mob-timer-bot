module.exports = {
    globals: {
        UrlFetchApp: {},
        console: {},
        PropertiesService: {},
        OAuth2: {},
        CacheService: {},
        ContentService: {},
        ScriptApp: {},
        Utilities: {},
        cCryptoGS: {},
        JobBroker: {},
    },
    moduleDirectories: [
        'node_modules',
    ],
    moduleFileExtensions: [
        'js',
        'json',
        'ts',
        'tsx',
    ],
    preset: 'ts-jest',
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: "tsconfig.json", diagnostics: false }]
    },
    transformIgnorePatterns: [
        "/node_modules/(?!apps-script-jobqueue)"
    ]
};