export const inputToCommand = (input: string): SpecialCommand => {
  const [enm] = Object.entries(SpecialCommand).find(([, value]) => value === input.toLowerCase()) || [undefined];
  return enm ? (<any>SpecialCommand)[enm] : SpecialCommand.UNKNOWN;
};

export const isCommand = (input: any): input is SpecialCommandInput => {
  return "command" in input;
};

export interface EndTurn extends SpecialCommandInput {
  command: SpecialCommand.END_TURN;
}

export type TerminalCommand = SpecialCommand.QUIT;

export interface Quit extends SpecialCommandInput {
  command: TerminalCommand;
}

export const isQuitCommandInput = (cmd: any): cmd is Quit => {
  return isCommand(cmd) && isQuitCommand(cmd.command);
};

export const isQuitCommand = (cmd: SpecialCommand): cmd is SpecialCommand.QUIT => {
  return isCommandOfType(cmd, [SpecialCommand.QUIT]);
};

export const isCommandOfType = <T extends SpecialCommand>(cmd: SpecialCommand, types: T[]): cmd is T => {
  return types.includes(cmd as T);
};

export type UserInput = SpecialCommandInput | UtteranceInput | CorrectionInput | Corrections;
export type UtteranceInput = {utterance: string};
export type SpecialCommandInput = {command: SpecialCommand};
/**
 * Command values should be lower cased.
 * Command evaluation will be case agnostic.
 */
export enum SpecialCommand {
  QUIT = ".quit",
  SAVE = ".save",
  VARS = ".vars",
  END_TURN = ".endturn",
  UNKNOWN = "UNKNOWN",
}

export interface CorrectionInput {
  correction: string;
}

export interface CorrectionsInput {
  type?: CorrectionInput;
  content: CorrectionInput | SpecialCommandInput;
}

export interface Corrections {
  type?: CorrectionInput;
  content: CorrectionInput;
}

export interface ACDLLineInfo {
  responses: ACDLLineInfoCell[];
  beforeResponse: ACDLLineInfoCell[];
}

export interface ACDLLineInfoCell {
  acdl: string;
  explanation: string;
}

export interface ResponseAndAcdlGroup {
  responseLine?: string;
  acdlLines?: ACDLLineInfoCell[];
}

export interface ResponseAndAcdlGroups {
  before: ACDLLineInfoCell[];
  groups: ResponseAndAcdlGroup[];
}

export const partitionAcdlResponses = (acdlLines: ACDLLineInfo, responses: string[]): ResponseAndAcdlGroups => {
  // Partition the ACDL lines with each partition ending with response()
  const partitionedAcdlLines = acdlLines.responses
    .reduce((acc, resp) => {
      const [head = [], ...rest] = acc;

      // Add a new partition to the start when the response ends with response()
      return [
        ...(resp.acdl.match(/.*response\(.+\).*/g) ? [[]] : []),
        // Add the current response to the first partition
        [...head, resp],
        ...rest,
      ];
    }, [] as ACDLLineInfoCell[][])
    // New partitions are at the end of the list, reverse to get the right order
    .reverse();

  return {
    // Match a response with the partitioned acdlLines.
    // Its possible for the acdlLine partitions or the responses to be longer.
    groups: [...Array(Math.max(partitionedAcdlLines.length, responses.length)).keys()].map((i) => ({
      responseLine: responses.length > i ? responses[i] : undefined,
      acdlLines: partitionedAcdlLines.length > i ? partitionedAcdlLines[i] : undefined,
    })),
    before: acdlLines.beforeResponse,
  };
};
