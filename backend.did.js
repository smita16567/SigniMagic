export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    saveSession: IDL.Func([IDL.Vec(IDL.Text)], [], []),
    getSessions: IDL.Func([], [IDL.Vec(IDL.Vec(IDL.Text))], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };