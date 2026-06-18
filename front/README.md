server {
    server_name fernandesmadeira.shop www.fernandesmadeira.shop;

    location / {
        proxy_pass http://localhost:3066;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}