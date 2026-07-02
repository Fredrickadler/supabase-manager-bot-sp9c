export const CB = {
  HOME: 'home',
  ACCOUNTS_LIST: 'acc:list',
  ACCOUNTS_ADD: 'acc:add',
  ACCOUNTS_VIEW: 'acc:view', // acc:view:<id>
  ACCOUNTS_DELETE: 'acc:del', // acc:del:<id>
  ACCOUNTS_DELETE_CONFIRM: 'acc:delc', // acc:delc:<id>
  ACCOUNTS_RENAME: 'acc:ren', // acc:ren:<id>
  ACCOUNTS_SET_DEFAULT: 'acc:def', // acc:def:<id>

  PROJECTS_LIST: 'proj:list', // proj:list:<accId>:<page>
  PROJECTS_VIEW: 'proj:view', // proj:view:<accId>:<projectRef>
  PROJECTS_CREATE: 'proj:new',
  PROJECTS_DELETE: 'proj:del',
  PROJECTS_DELETE_CONFIRM: 'proj:delc',
  PROJECTS_RESTART: 'proj:restart',
  PROJECTS_RENAME: 'proj:ren',

  SQL_EDITOR: 'sql:open', // sql:open:<accId>:<projectRef>
  SQL_RUN: 'sql:run',

  ADMIN_HOME: 'admin:home',
  ADMIN_STATS: 'admin:stats',
  ADMIN_BROADCAST: 'admin:bc',
  ADMIN_BLOCK: 'admin:block',
  ADMIN_ERRORS: 'admin:errors',

  COPY: 'copy', // copy:<field>:<token-ref>  (ephemeral, resolved via cache)
  CANCEL: 'cancel',
  BACK: 'back',
  NOOP: 'noop',
} as const;

export const PAGE_SIZE = 5;

export const SUPABASE_REGIONS = [
  { label: '🇺🇸 East US (N. Virginia)', value: 'us-east-1' },
  { label: '🇺🇸 West US (Oregon)', value: 'us-west-1' },
  { label: '🇮🇪 EU West (Ireland)', value: 'eu-west-1' },
  { label: '🇩🇪 EU Central (Frankfurt)', value: 'eu-central-1' },
  { label: '🇸🇬 Southeast Asia (Singapore)', value: 'ap-southeast-1' },
  { label: '🇯🇵 Northeast Asia (Tokyo)', value: 'ap-northeast-1' },
];

export const SUPABASE_MANAGEMENT_API = 'https://api.supabase.com/v1';
