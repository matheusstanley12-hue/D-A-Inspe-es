import jsPDF from 'jspdf';

export const addSystemPDFHeader = async (doc: jsPDF, title: string) => {
  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);
  
  // Company Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("D&A Inspeções D&A Inspeções e Fabricação LTDA", 14, 30);
  
  doc.setFont("helvetica", "bold");
  doc.text("Telefone: ", 14, 35);
  doc.setFont("helvetica", "normal");
  doc.text("(31) 3564-5360", 31, 35);
  
  doc.setFont("helvetica", "bold");
  doc.text("CNPJ: ", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.text("23.157.980/0001-36", 26, 40);
  
  doc.setFont("helvetica", "bold");
  doc.text("Email: ", 14, 45);
  doc.setFont("helvetica", "normal");
  doc.text("contato@deainspecoes.com.br", 26, 45);
  
  doc.setFont("helvetica", "bold");
  doc.text("Endereço: ", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text("Av. Raja Gabáglia, 2000, Torre 2 - Sala 210 - Estoril - CEP 30494-170", 32, 50);

  // Load and Add Logo
  try {
    const response = await fetch('/logo.jpg');
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      doc.addImage(base64, 'JPEG', 150, 15, 45, 30, undefined, 'FAST');
    }
  } catch (error) {
    console.error("Erro ao carregar a logo para o PDF:", error);
  }

  // Divider Line
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 55, 196, 55);

  // Return the Y position where the rest of the content (like tables) should start
  return 65;
};
