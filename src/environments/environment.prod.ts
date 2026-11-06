// En AWS la web y la API se sirven desde el mismo servidor (nginx pasa /api al backend),
// así que basta una ruta relativa. Para otro hosting, pon aquí la URL completa de la API.
export const environment = {
  production: true,
  apiUrl: '/api'
};
