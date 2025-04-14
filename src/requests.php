<?php
header('Content-Type: application/json; charset=UTF-8');

// header("Access-Control-Allow-Origin: *");

// // Desativar exibição de erros no JSON (apenas para debug)
// ini_set('display_errors', 0);
// error_reporting(0);

$host = "localhost";
$user = "root";
$password = "";
$db = "pibic";

$con = new mysqli($host, $user, $password, $db);

if ($con->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $con->connect_error]);
    exit();
}

$sql = "SELECT 
            cat.id_categoria,
            cat.icon AS categoria_icon, 
            cat.nome AS categoria_nome, 
            pal.id_palavra, 
            pal.nome AS palavra_nome, 
            dem.id AS id_demonstracao,
            dem.link, 
            dem.midia, 
            dem.explicao
        FROM categoria cat
        LEFT JOIN palavra pal ON cat.id_categoria = pal.id_categoria
        LEFT JOIN demonstracao dem ON pal.id_palavra = dem.id_palavra
        ORDER BY cat.id_categoria, pal.id_palavra, dem.id";

$result = $con->query($sql);

$data = [];
while ($row = $result->fetch_assoc()) {
    $id_categoria = $row['id_categoria'];
    $id_palavra = $row['id_palavra'];

    if (!isset($data[$id_categoria])) {
        $data[$id_categoria] = [
            "id_categoria" => $id_categoria,
            "nome" => $row['categoria_nome'],
            "icon" => $row['categoria_icon'],
            "palavras" => []
        ];
    }

    if ($id_palavra !== null) {
        if (!isset($data[$id_categoria]["palavras"][$id_palavra])) {
            $data[$id_categoria]["palavras"][$id_palavra] = [
                "id_palavra" => $id_palavra,
                "nome" => $row['palavra_nome'],
                "demonstracoes" => []
            ];
        }

        if ($row['id_demonstracao'] !== null) {
            $data[$id_categoria]["palavras"][$id_palavra]["demonstracoes"][] = [
                "id" => $row['id_demonstracao'],
                "link" => $row['link'],
                "midia" => $row['midia'],
                "explicacao" => $row['explicao']
            ];
        }
    }
}

$data = array_values($data);
foreach ($data as &$categoria) {
    $categoria["palavras"] = array_values($categoria["palavras"]);
}

echo json_encode(["data" => $data]);

$con->close();
?>
