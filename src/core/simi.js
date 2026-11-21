const replies = [
  [/^(oi|ol[aá]|opa|eae|eai|bom dia|boa tarde|boa noite)[!?. ]*$/i, ['Opa! 😎', 'E aí, tudo certo?', 'Salve! 🤖']],
  [/^(tudo bem|como vai|como voc[eê] est[aá])[?!. ]*$/i, ['Tô na ativa! E você?', 'Tudo certo por aqui! 😄']],
  [/^(obrigad[oa]|valeu|vlw)[!?. ]*$/i, ['Tamo junto! 🤝', 'É nóis!']],
  [/^(quem [eé] voc[eê]|qual seu nome)[?!. ]*$/i, ['Sou o Vizzabot! 🤖']],
  [/^(kkk+|haha+|rsrs+)[!?. ]*$/i, ['KAKAKAKAKA 😂']]
];
export function simiReply(text, name = 'Vizzabot V5') {
  const value = String(text || '').trim().slice(0, 300);
  for (const [pattern, answers] of replies) if (pattern.test(value)) {
    const choice = answers[Math.floor(Math.random() * answers.length)];
    return choice.replace('Vizzabot', name);
  }
  return null;
}
