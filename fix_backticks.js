const fs = require('fs');
let content = fs.readFileSync('update_themes.js', 'utf8');

// Replace any remaining backticks with template literals
content = content.replace(/\\\`rgba\\\(\\\$\\{r\\},\\\\$\\{g\\},\\\\$\\{b\\},\\\\$\\{alpha\\}\\\)\\\`/g, "'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'");
content = content.replace(/\\\`rgba\\\(\\\$\\{r\\},\\\\$\\{g\\},\\\\$\\{b\\},0\.3\\\)\\\`/g, "'rgba(' + r + ',' + g + ',' + b + ',0.3)'");
content = content.replace(/\\\`rgba\\\(\\\$\\{a\.color\.r\\},\\\\$\\{a\.color\.g\\},\\\\$\\{a\.color\.b\\},\\\\$\\{lineAlpha\\}\\\)\\\`/g, "'rgba(' + a.color.r + ',' + a.color.g + ',' + a.color.b + ',' + lineAlpha + ')'");
content = content.replace(/\\\`rgba\\\(\\\$\\{b\.color\.r\\},\\\\$\\{b\.color\.g\\},\\\\$\\{b\.color\.b\\},\\\\$\\{lineAlpha\\}\\\)\\\`/g, "'rgba(' + b.color.r + ',' + b.color.g + ',' + b.color.b + ',' + lineAlpha + ')'");

// Also check for the unescaped versions just in case
content = content.replace(/\`rgba\(\$\{r\},\$\{g\},\$\{b\},\$\{alpha\}\)\`/g, "'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'");
content = content.replace(/\`rgba\(\$\{r\},\$\{g\},\$\{b\},0\.3\)\`/g, "'rgba(' + r + ',' + g + ',' + b + ',0.3)'");
content = content.replace(/\`rgba\(\$\{a\.color\.r\},\$\{a\.color\.g\},\$\{a\.color\.b\},\$\{lineAlpha\}\)\`/g, "'rgba(' + a.color.r + ',' + a.color.g + ',' + a.color.b + ',' + lineAlpha + ')'");
content = content.replace(/\`rgba\(\$\{b\.color\.r\},\$\{b\.color\.g\},\$\{b\.color\.b\},\$\{lineAlpha\}\)\`/g, "'rgba(' + b.color.r + ',' + b.color.g + ',' + b.color.b + ',' + lineAlpha + ')'");

fs.writeFileSync('update_themes.js', content);
console.log('Fixed backticks');
