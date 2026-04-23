**Aluno avaliado: Raphael Torres (https://github.com/raphaeltcf/Atividade-2-IA)**

A revisão do sistema do seu colega deve responder as seguintes perguntas:

1. O sistema está funcionando com as funcionalidades solicitadas?

Sim, todas as funcionalidades funcionam, conforme pude testar. Inclusive a mais importante, que é o envio de emails.

2. Quais os problemas de qualidade do código e dos testes?

Os arquivos json estão sendo vistos pelo git, e foram commitados. Isso é algo que também está no meu, mas mantive os jsons vazios.
Os testes foram implementados conforme os cenários e cobrem várias coisas. Há validação dos campos no código, como pude atestar, mas não consegui rodar os testes pelo Docker.
O email que chega para o aluno contém o id da meta, em vez do nome. Isso fica bem confuso para quem está lendo.

4. Como a funcionalidade e a qualidade desse sistema pode ser comparada com as do seu sistema?

Gostei de como ficaram organizados os arquivos e a aparência da página. Tanto o meu quanto o do colega funcionam. O colega implementou uma validação mais robusta para o CPF, coisa que não fiz. Ele também tentou permitir o cadastro de metas (apesar das rotas não terem funcionado), coisa que deixei hardcoded.

---

A revisão do histórico do desenvolvimento do seu colega deve resumir:

1. Estratégias de interação utilizada

Começou com um prompt para estruturar bem o repositório, já com as tecnologias e diretórios corretos. Ele foi fazendo bem aos poucos, sendo bem especifico sobre tipos e como/onde deveria ser implementado determinadas coisas. Essa estratégia com certeza direcionou melhor o modelo a criar código de forma controlada.

2. Situações em que o agente funcionou melhor ou pior

Em geral o agente pareceu se comportar bem em todos os prompts, mas acredito que para o 10 (onde as rotas são criadas), não foi feito completamente a parte de metas (ou ao menos a conexão com o front), já que o endpoint não funcionou quando tentei usar a interface.

3. Tipos de problemas observados (por exemplo, código incorreto ou inconsistências)

Não houve problemas relatados. O único foi uma sugestão do que o modelo poderia ter feito (aproveitar de modelos já prontos para estruturar o repositório)

4. Avaliação geral da utilidade do agente no desenvolvimento

O agente foi muito útil. Entendi pelo histórico que o colega não interviu em nada manualmente. Considerando o resultado final, ficou bem satisfatório.

5. Comparação com a sua experiência de uso do agente

Meus prompts foram bem menos detalhados. Me guiei bastante pelo que já estava escrito no PDF, apenas incrementando em uma situação ou outra que achei necessário. Também, fiz uso de agente orquestrador e skills. O colega usou um AGENTS.md, que equivale em partes ao que fiz no meu
