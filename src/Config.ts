
interface ConfigInterface {
    cloud_notifier_uri?: string;
    cloud_notifier_key?: string;
}

export class Config {
    private static cloudNotifierURI?: string;
    private static cloudNotifierKey?: string;

    static init() {
        const _configObjectString = process.env.ENG_COMPLIANCE_CONFIG_OBJECT || '{}';
        const configObject: ConfigInterface = JSON.parse(_configObjectString);
        Config.cloudNotifierURI = configObject.cloud_notifier_uri;
        Config.cloudNotifierKey = configObject.cloud_notifier_key;
    }

    static isCloudNotifierEnabled(): boolean {
        return Config.cloudNotifierURI != null && Config.cloudNotifierKey != null;
    }

    static getCloudNotifierURI(): string | undefined {
        return Config.cloudNotifierURI;
    }

    static getCloudNotifierKey(): string | undefined {
        return Config.cloudNotifierKey;
    }
}