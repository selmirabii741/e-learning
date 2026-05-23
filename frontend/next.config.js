
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['pdf-parse'],
    },
    images: {
        domains: ['res.cloudinary.com', 'avatars.githubusercontent.com', 'ui-avatars.com'],
    },
};

module.exports = nextConfig;
