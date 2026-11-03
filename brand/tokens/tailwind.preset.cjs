// Tailwind CSS 3 preset. Import tokens.css in application.
module.exports = {
  "theme": {
    "extend": {
      "colors": {
        "bg": "var(--bg)",
        "surface": "var(--surface)",
        "surface-2": "var(--surface-2)",
        "border": "var(--border)",
        "control-border": "var(--control-border)",
        "text": "var(--text)",
        "text-muted": "var(--text-muted)",
        "primary": "var(--primary)",
        "on-primary": "var(--on-primary)",
        "accent": "var(--accent)",
        "on-accent": "var(--on-accent)",
        "success": "var(--success)",
        "warning": "var(--warning)",
        "danger": "var(--danger)",
        "on-danger": "var(--on-danger)",
        "info": "var(--info)"
      },
      "fontFamily": {
        "sans": [
          "Plus Jakarta Sans",
          "sans-serif"
        ]
      },
      "borderRadius": {
        "control": "12px",
        "panel": "24px"
      }
    }
  }
};
