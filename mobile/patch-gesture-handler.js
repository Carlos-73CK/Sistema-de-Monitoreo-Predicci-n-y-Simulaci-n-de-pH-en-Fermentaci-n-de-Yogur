const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, 'node_modules', 'react-native-gesture-handler', 'android', 'build.gradle');

if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  if (!content.includes("java {\n            if (isNewArchitectureEnabled()) {")) {
    content = content.replace(
      /sourceSets\.main\s*\{\s*kotlin\s*\{/g,
      `sourceSets.main {
        java {
            if (isNewArchitectureEnabled()) {
                srcDirs += 'fabric/src/main/java'
            } else {
                srcDirs += 'paper/src/main/java'
            }
        }
        kotlin {`
    );
    fs.writeFileSync(gradlePath, content, 'utf8');
    console.log('[patch-gesture-handler] Applied java sourceSets patch to react-native-gesture-handler');
  } else {
    console.log('[patch-gesture-handler] Patch already applied');
  }
}
