// Prefer IPv4: this network's IPv6 route to Neon black-holes large packets,
// which makes Node's fetch hang with ETIMEDOUT while curl works fine.
require("node:dns").setDefaultResultOrder("ipv4first");

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
