
interface ConfigInterface {
    cloud_notifier_uri?: string;
    cloud_notifier_key?: string;
}

export class Config {
    private static cloud_notifier_uri?: string;
    private static cloud_notifier_key?: string;

    static init() {
        const _configObjectString = process.env.ENG_COMPLIANCE_CONFIG_OBJECT || '{}';
        const configObject: ConfigInterface = JSON.parse(_configObjectString);
        Config.cloud_notifier_uri = configObject.cloud_notifier_uri;
        Config.cloud_notifier_key = configObject.cloud_notifier_key;
    }

    static isCloudNotifierEnabled(): boolean {
        return Config.cloud_notifier_uri != null && Config.cloud_notifier_key != null;
    }

    static getCloudNotifierURI(): string | undefined {
        return Config.cloud_notifier_uri;
    }

    static getCloudNotifierKey(): string | undefined {
        return Config.cloud_notifier_key;
    }
}