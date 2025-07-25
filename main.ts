import { Array, Chunk, Duration, Effect, Schedule } from "effect";

const stampOfSchedule = (
  schedule: Schedule.Schedule<unknown>,
  taskDuration: Duration.DurationInput = 0,
  maxRecurs = 10,
): string => {
  const delays = Chunk.toArray(
    Effect.runSync(
      Schedule.run(
        Schedule.delays(Schedule.addDelay(schedule, () => taskDuration)),
        0,
        Array.range(0, maxRecurs),
      ),
    ),
  );

  return delays
    .map((duration, i) => {
      if (i === maxRecurs) {
        return "..."; // Indicate truncation if there are more executions
      } else if (i === delays.length - 1) {
        return "(end)"; // Mark the last execution
      } else {
        return `#${i + 1}: ${Duration.toMillis(duration)}ms`;
      }
    })
    .join("\n");
};

if (import.meta.vitest) {
  const { it } = import.meta.vitest;
  it("forever", ({ expect }) => {
    expect(stampOfSchedule(Schedule.forever)).toMatchInlineSnapshot(`
      "#1: 0ms
      #2: 0ms
      #3: 0ms
      #4: 0ms
      #5: 0ms
      #6: 0ms
      #7: 0ms
      #8: 0ms
      #9: 0ms
      #10: 0ms
      ..."
    `);
  });

  it("recurs 5", ({ expect }) => {
    expect(stampOfSchedule(Schedule.recurs(5))).toMatchInlineSnapshot(`
      "#1: 0ms
      #2: 0ms
      #3: 0ms
      #4: 0ms
      #5: 0ms
      (end)"
    `);
  });

  it("recurs 5 + 5mills", ({ expect }) => {
    expect(
      stampOfSchedule(
        Schedule.recurs(5).pipe(Schedule.addDelay(() => "5 millis")),
      ),
    ).toMatchInlineSnapshot(`
      "#1: 5ms
      #2: 5ms
      #3: 5ms
      #4: 5ms
      #5: 5ms
      (end)"
    `);
  });

  it("exponential", ({ expect }) => {
    expect(stampOfSchedule(Schedule.exponential("1 seconds", 1.1)))
      .toMatchInlineSnapshot(`
        "#1: 1000ms
        #2: 1100ms
        #3: 1210ms
        #4: 1331ms
        #5: 1464.1ms
        #6: 1610.51ms
        #7: 1771.561ms
        #8: 1948.7171ms
        #9: 2143.58881ms
        #10: 2357.947691ms
        ..."
      `);
  });

  it("exponential", ({ expect }) => {
    expect(
      stampOfSchedule(
        Schedule.exponential("1 seconds", 1.1).pipe(
          Schedule.addDelay(() => "2 seconds"),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "#1: 3000ms
      #2: 3100ms
      #3: 3210ms
      #4: 3331ms
      #5: 3464.1ms
      #6: 3610.51ms
      #7: 3771.561ms
      #8: 3948.7171ms
      #9: 4143.58881ms
      #10: 4357.947691ms
      ..."
    `);
  });

  it("exponential", ({ expect }) => {
    expect(
      stampOfSchedule(
        Schedule.fixed("2 seconds").pipe(
          Schedule.union(Schedule.fixed("3 seconds")),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "#1: 2000ms
      #2: 1000ms
      #3: 1000ms
      #4: 2000ms
      #5: 2000ms
      #6: 1000ms
      #7: 1000ms
      #8: 2000ms
      #9: 2000ms
      #10: 1000ms
      ..."
    `);
  });
}
