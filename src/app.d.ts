import type { KujiraClient } from '$lib/network/types';
import 'unplugin-icons/types/svelte';

import pkg from 'pg';
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			rpc: KujiraClient;
			db: pkg.PoolClient;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export { };
