#!/usr/bin/env node
import { startAgent } from '../src/index.js';
import fs from 'fs';
import yaml from 'js-yaml';

const configPath = process.argv[2] || 'agent.config.yaml';

if (!fs.existsSync(configPath)) {
  console.error('Config file not found:', configPath);
  process.exit(1);
}

const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
startAgent(config);
