const { twMerge } = require('tailwind-merge');
console.log(twMerge("sm:max-w-sm sm:max-w-[950px]"));
console.log(twMerge("sm:max-w-sm sm:max-w-lg"));
console.log(twMerge("sm:max-w-sm w-[95vw] sm:max-w-[950px]"));
