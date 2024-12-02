{ pkgs }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [
    "bradlc.vscode-tailwindcss"
    "chamboug.js-auto-backticks"
    "christian-kohler.path-intellisense"
    "dbaeumer.vscode-eslint"
    "DominicVonk.parameter-hints"
    "dsznajder.es7-react-js-snippets"
    "eamodio.gitlens"
    "ecmel.vscode-html-css"
    "esbenp.prettier-vscode"
    "github.vscode-github-actions"
    "khan.two-monokai"
    "moalamri.inline-fold"
    "PKief.material-icon-theme"
    "ritwickdey.LiveServer"
    "shardulm94.trailing-spaces"
    "standard.vscode-standard"
    "stylelint.vscode-stylelint"
    "usernamehw.errorlens"
    "YoavBls.pretty-ts-errors"
    "vscode-icons-team.vscode-icons"
  ];
  idx.previews = {
    # previews = {
    #   web = {
    #     command = [
    #       "npm"
    #       "run"
    #       "dev"
    #       "--"
    #       "--port"
    #       "$PORT"
    #       "--hostname"
    #       "0.0.0.0"
    #     ];
    #     manager = "web";
    #   };
    # };
  };
}
