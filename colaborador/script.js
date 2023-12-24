document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Função para criar o hash SHA-256 da senha
    function hashPassword(password) {
        return sha256(password);
    }

    // Leitura do arquivo CSV
    Papa.parse("/db/auth.csv", {
        download: true,
        complete: function (results) {
            var data = results.data;
            var authenticated = false;

            for (var i = 1; i < data.length; i++) {  // Começando de 1 para pular o cabeçalho do CSV
                var login = data[i][0];
                var senhaCriptografada = data[i][1];

                if (username === login && hashPassword(password) === senhaCriptografada) {
                    authenticated = true;
                    break;
                }
            }

            if (authenticated) {
                window.location.href = "/sistemas";
            } else {
                document.getElementById("errorMessage").innerText = "Usuário ou senha inválidos. Entre em contato com o administrador.";
            }
        }
    });
});