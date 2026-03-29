<?php
/* Unraid MCP - Settings Page */

$plugin = "unraid-mcp";
$plugindir = "/boot/config/plugins/$plugin";
$configfile = "$plugindir/config.env";

// Parse existing config
$config = [];
if (file_exists($configfile)) {
    foreach (file($configfile) as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $config[trim($key)] = trim($value);
        }
    }
}

// Handle form submission
if ($_POST) {
    $newConfig = [
        "# Unraid MCP Server Configuration",
        "UNRAID_HOST=" . escapeshellarg($_POST['UNRAID_HOST'] ?? 'localhost'),
        "UNRAID_GRAPHQL_PORT=" . (int)($_POST['UNRAID_GRAPHQL_PORT'] ?? 31337),
        "UNRAID_API_KEY=" . escapeshellarg($_POST['UNRAID_API_KEY'] ?? ''),
        "UNRAID_USE_TLS=" . (isset($_POST['UNRAID_USE_TLS']) ? 'true' : 'false'),
        "MCP_SERVER_PORT=" . (int)($_POST['MCP_SERVER_PORT'] ?? 3000),
        "LOG_LEVEL=" . escapeshellarg($_POST['LOG_LEVEL'] ?? 'info'),
    ];
    file_put_contents($configfile, implode("\n", $newConfig) . "\n");

    // Restart the service
    if ($_POST['action'] === 'Apply') {
        exec("/etc/rc.d/rc.unraid-mcp restart");
    } elseif ($_POST['action'] === 'Stop') {
        exec("/etc/rc.d/rc.unraid-mcp stop");
    } elseif ($_POST['action'] === 'Start') {
        exec("/etc/rc.d/rc.unraid-mcp start");
    }
}

// Get service status
$status = shell_exec("/etc/rc.d/rc.unraid-mcp status 2>&1");
$running = strpos($status, 'running') !== false;
?>

<div id="title">
  <span class="left">Unraid MCP Server
    <a href="https://github.com/lherron/unraid-mcp" target="_blank">
      <img src="/webGui/images/help.png">
    </a>
  </span>
</div>

<form method="POST">
  <div class="plugin-settings">
    <table class="settings-table">
      <tr>
        <td><strong>Status:</strong></td>
        <td>
          <span style="color: <?= $running ? 'green' : 'red' ?>">
            <?= $running ? 'Running' : 'Stopped' ?>
          </span>
          <?php if ($running): ?>
            &nbsp; | &nbsp; MCP endpoint: <code>http://<?= htmlspecialchars($config['UNRAID_HOST'] ?? 'localhost') ?>:<?= htmlspecialchars($config['MCP_SERVER_PORT'] ?? '3000') ?>/mcp</code>
          <?php endif; ?>
        </td>
      </tr>
      <tr>
        <td><strong>Unraid Host:</strong></td>
        <td>
          <input type="text" name="UNRAID_HOST" value="<?= htmlspecialchars($config['UNRAID_HOST'] ?? 'localhost') ?>" />
          <span class="setting-hint">Usually 'localhost' when running on this server</span>
        </td>
      </tr>
      <tr>
        <td><strong>GraphQL Port:</strong></td>
        <td>
          <input type="number" name="UNRAID_GRAPHQL_PORT" value="<?= htmlspecialchars($config['UNRAID_GRAPHQL_PORT'] ?? '31337') ?>" />
          <span class="setting-hint">Default 31337 (Unraid 7.2+)</span>
        </td>
      </tr>
      <tr>
        <td><strong>API Key:</strong></td>
        <td>
          <input type="password" name="UNRAID_API_KEY" value="<?= htmlspecialchars($config['UNRAID_API_KEY'] ?? '') ?>" />
          <span class="setting-hint">Generate from Unraid Settings → API Keys</span>
        </td>
      </tr>
      <tr>
        <td><strong>Use TLS:</strong></td>
        <td>
          <input type="checkbox" name="UNRAID_USE_TLS" <?= ($config['UNRAID_USE_TLS'] ?? 'false') === 'true' ? 'checked' : '' ?> />
        </td>
      </tr>
      <tr>
        <td><strong>MCP Server Port:</strong></td>
        <td>
          <input type="number" name="MCP_SERVER_PORT" value="<?= htmlspecialchars($config['MCP_SERVER_PORT'] ?? '3000') ?>" />
        </td>
      </tr>
      <tr>
        <td><strong>Log Level:</strong></td>
        <td>
          <select name="LOG_LEVEL">
            <?php foreach (['debug', 'info', 'warn', 'error'] as $level): ?>
              <option value="<?= $level ?>" <?= ($config['LOG_LEVEL'] ?? 'info') === $level ? 'selected' : '' ?>><?= $level ?></option>
            <?php endforeach; ?>
          </select>
        </td>
      </tr>
    </table>
  </div>

  <div class="plugin-actions">
    <input type="submit" name="action" value="Apply" />
    <input type="submit" name="action" value="Start" <?= $running ? 'disabled' : '' ?> />
    <input type="submit" name="action" value="Stop" <?= !$running ? 'disabled' : '' ?> />
  </div>
</form>
