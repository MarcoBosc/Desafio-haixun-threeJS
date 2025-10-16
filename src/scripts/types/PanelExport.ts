export type ExportFuracao = {
    diametro: number;
    profundidade: number;
    posicao: { x: number; y: number; z: number }; // coordenadas locais da peça
  };
  
  export type ExportMedidas = {
    comprimento: number;
    largura: number;
    espessura: number;
  };
  
  export type ExportPeca = {
    numeracao: number;              // Numeração da peça
    nome: string;                   // Nome da peça
    medidas: ExportMedidas;         // Medidas da peça (C, L, E)
    furacoes: ExportFuracao[];      // Furações da peça (posições, diâmetro, profundidade)
  };