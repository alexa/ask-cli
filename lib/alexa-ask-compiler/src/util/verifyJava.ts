import {execSync} from "child_process";

/**
 * verifies java presence
 * @public
 */
export const verifyJava = ()  => {
    try {
        execSync('java -version', { stdio: 'ignore' });
    } catch (error) {
        // client side issue
        throw new Error(`${error}
Either Java is not installed or have not configured JAVA_HOME path correctly on your machine.
Please configure Java to run the ASK compiler successfully on your machine.
You can download and install the java depending on your operating system from - https://www.java.com/en/download/help/download_options.xml
If you are able to run 'java -version' successfully, but, still face issue while running ASK Compiler, please feel free to reach out to us on Github (https://github.com/alexa/ask-cli/issues).`);
    }
}