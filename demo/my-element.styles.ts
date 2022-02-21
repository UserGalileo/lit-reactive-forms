import { css } from "lit";

export const styles = css`

input[valid], select[valid], textarea[valid] {
  border-color: green !important;
}

input[invalid], select[invalid], textarea[invalid] {
  border-color: red !important;
}

input[pending], select[pending], textarea[pending] {
  border-color: orange !important;
}

input, select, textarea {
  outline: 0;
}

input[disabled], select[disabled], textarea[disabled] {
  opacity: .3;
}

input[required] {
  background-image: radial-gradient(black 35%, transparent 35%);
  background-size: 1em 1em;
  background-position: top right;
  background-repeat: no-repeat
}
`