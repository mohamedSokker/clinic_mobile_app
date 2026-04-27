const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNonModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let content = fs.readFileSync(podfilePath, 'utf8');

      const fixIdentifier = '# [START] withNonModularHeaders FIX';
      const fixEndIdentifier = '# [END] withNonModularHeaders FIX';

      const fix = `
      ${fixIdentifier}
      
      # 1. Fix broken Firebase Messaging source files (v24.0.0 bug)
      puts "Applying patches via patch-package..."
      system("cd .. && npx patch-package")

      installer.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
          # Allow non-modular includes (fixes the 'must be imported from module' errors)
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          
          # Force DEFINES_MODULE to NO for Firebase and React-Core if they are causing umbrella header conflicts
          if ['RNFBApp', 'RNFBMessaging', 'React-Core'].include?(target.name)
             config.build_settings['DEFINES_MODULE'] = 'NO'
             config.build_settings['CLANG_ENABLE_MODULES'] = 'NO'
          end
        end
        
        # Specific fix for React Native Firebase modular header issues
        if ['RNFBApp', 'RNFBMessaging', 'React-Core'].include?(target.name)
          target.build_configurations.each do |config|
            config.build_settings['OTHER_CFLAGS'] = (config.build_settings['OTHER_CFLAGS'] || '') + ' -Wno-error=modular-has-not-been-imported'
          end
        end
      end
      ${fixEndIdentifier}
`;

      // Clean up ANY existing versions of this fix or similar ad-hoc fixes
      content = content.replace(/# \[START\] withNonModularHeaders FIX[\s\S]*?# \[END\] withNonModularHeaders FIX/g, '');
      // Also clean up the old un-labeled version I might have left
      content = content.replace(/installer\.pods_project\.targets\.each do \|target\|[\s\S]*?config\.build_settings\['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'\] = 'YES'[\s\S]*?end[\s\S]*?end/g, '');

      if (content.includes('post_install do |installer|')) {
        content = content.replace(
          'post_install do |installer|',
          'post_install do |installer|' + fix
        );
      } else {
        content += `
post_install do |installer|
${fix}
end
`;
      }

      fs.writeFileSync(podfilePath, content);
      return config;
    },
  ]);
};
