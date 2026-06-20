package com.fittrack;

/*
 * FitTrack Pro – Java Spring Boot REST API
 * =========================================
 * Full backend for the Fitness & Macro Tracker.
 *
 * Stack : Spring Boot 3 · Spring Data JPA · H2 (dev) / MySQL (prod)
 *
 * Run   : mvn spring-boot:run
 * Docs  : http://localhost:8080/swagger-ui.html
 *
 * All classes are in one file for portability.
 * In a real project, split into packages:
 *   model / repository / service / controller / dto / config
 */

// ─────────────────────────────────────────────────────────
//  IMPORTS (include all in pom.xml — see bottom of file)
// ─────────────────────────────────────────────────────────
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// ─────────────────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────────────────
@SpringBootApplication
public class FitTrackApplication {
    public static void main(String[] args) {
        SpringApplication.run(FitTrackApplication.class, args);
    }
}

// ═══════════════════════════════════════════════════════
//  ENTITIES
// ═══════════════════════════════════════════════════════

/** User profile */
@Entity @Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank private String name;
    @Email    private String email;
    private Integer age;
    private Double  heightCm;
    private Double  weightKg;

    @Enumerated(EnumType.STRING)
    private GoalType goalType = GoalType.MAINTAIN;

    private Integer calorieGoal = 2000;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum GoalType { CUT, MAINTAIN, BULK }
}

/** A logged meal */
@Entity @Table(name = "meals")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class Meal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull private Long    userId;
    @NotBlank private String name;
    private String  emoji    = "🍽️";
    private String  mealType = "lunch";

    @NotNull @Min(0) private Integer calories;
    private Double protein = 0.0;
    private Double carbs   = 0.0;
    private Double fat     = 0.0;

    @NotNull private LocalDate date;
    private LocalDateTime createdAt = LocalDateTime.now();
}

/** A logged workout session */
@Entity @Table(name = "workouts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class Workout {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull private Long   userId;
    @NotBlank private String workoutType;

    @Min(1) private Integer durationMinutes;
    private Integer caloriesBurned = 0;
    private String  intensity      = "moderate";
    private String  notes          = "";

    @NotNull private LocalDate date;
}

/** Weight log entry */
@Entity @Table(name = "weight_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class WeightEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull private Long   userId;
    @NotNull private Double weightKg;
    private Double  bodyFat;
    private String  notes    = "";

    @NotNull private LocalDate    date;
    private LocalDateTime loggedAt = LocalDateTime.now();
}

/** A fitness goal */
@Entity @Table(name = "goals")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class Goal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull private Long   userId;
    @NotBlank private String name;
    private String  icon         = "🎯";
    private Double  currentValue = 0.0;

    @NotNull private Double targetValue;
    private String  unit         = "";

    @NotNull private LocalDate    deadline;
    private Boolean completed    = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}

// ═══════════════════════════════════════════════════════
//  REPOSITORIES
// ═══════════════════════════════════════════════════════

interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}

interface MealRepository extends JpaRepository<Meal, Long> {
    List<Meal> findByUserIdAndDateOrderByCreatedAtDesc(Long userId, LocalDate date);

    @Query("SELECT SUM(m.calories) FROM Meal m WHERE m.userId=:uid AND m.date=:d")
    Integer sumCaloriesByUserAndDate(@Param("uid") Long uid, @Param("d") LocalDate d);

    @Query("SELECT SUM(m.protein) FROM Meal m WHERE m.userId=:uid AND m.date=:d")
    Double sumProteinByUserAndDate(@Param("uid") Long uid, @Param("d") LocalDate d);

    @Query("SELECT SUM(m.carbs) FROM Meal m WHERE m.userId=:uid AND m.date=:d")
    Double sumCarbsByUserAndDate(@Param("uid") Long uid, @Param("d") LocalDate d);

    @Query("SELECT SUM(m.fat) FROM Meal m WHERE m.userId=:uid AND m.date=:d")
    Double sumFatByUserAndDate(@Param("uid") Long uid, @Param("d") LocalDate d);
}

interface WorkoutRepository extends JpaRepository<Workout, Long> {
    List<Workout> findByUserIdOrderByDateDesc(Long userId);

    @Query("SELECT SUM(w.caloriesBurned) FROM Workout w WHERE w.userId=:uid AND w.date=:d")
    Integer sumCalsBurnedByUserAndDate(@Param("uid") Long uid, @Param("d") LocalDate d);

    @Query("SELECT SUM(w.durationMinutes) FROM Workout w WHERE w.userId=:uid AND w.date=:d")
    Integer sumMinutesByUserAndDate(@Param("uid") Long uid, @Param("d") LocalDate d);
}

interface WeightRepository extends JpaRepository<WeightEntry, Long> {
    List<WeightEntry> findByUserIdOrderByDateAsc(Long userId);
}

interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserIdOrderByDeadlineAsc(Long userId);
}

// ═══════════════════════════════════════════════════════
//  DTOs
// ═══════════════════════════════════════════════════════

record MealRequest(
    @NotNull Long userId,
    @NotBlank String name,
    String emoji,
    String mealType,
    @NotNull @Min(0) Integer calories,
    Double protein, Double carbs, Double fat,
    LocalDate date
) {}

record WorkoutRequest(
    @NotNull Long userId,
    @NotBlank String workoutType,
    @NotNull @Min(1) Integer durationMinutes,
    Integer caloriesBurned,
    String intensity, String notes,
    LocalDate date
) {}

record WeightRequest(
    @NotNull Long userId,
    @NotNull Double weightKg,
    Double bodyFat, String notes,
    LocalDate date
) {}

record GoalRequest(
    @NotNull Long userId,
    @NotBlank String name,
    String icon,
    Double currentValue,
    @NotNull Double targetValue,
    String unit,
    @NotNull LocalDate deadline
) {}

record SummaryResponse(
    LocalDate date,
    CalorieSummary calories,
    MacroSummary macros,
    WorkoutSummary workout
) {}
record CalorieSummary(int eaten, int burned, int net, int goal) {}
record MacroSummary(double protein, double carbs, double fat) {}
record WorkoutSummary(int minutes) {}

record TdeeResponse(
    int bmr, int tdee, int targetCalories,
    MacroRecommendation macros
) {}
record MacroRecommendation(int proteinG, int fatG, int carbsG) {}

// ═══════════════════════════════════════════════════════
//  SERVICES
// ═══════════════════════════════════════════════════════

@Service @RequiredArgsConstructor @Transactional
class MealService {
    private final MealRepository repo;

    public List<Meal> getMeals(Long userId, LocalDate date) {
        return repo.findByUserIdAndDateOrderByCreatedAtDesc(userId, date);
    }

    public Meal addMeal(MealRequest req) {
        return repo.save(Meal.builder()
            .userId(req.userId()).name(req.name())
            .emoji(Optional.ofNullable(req.emoji()).orElse("🍽️"))
            .mealType(Optional.ofNullable(req.mealType()).orElse("lunch"))
            .calories(req.calories())
            .protein(Optional.ofNullable(req.protein()).orElse(0.0))
            .carbs(Optional.ofNullable(req.carbs()).orElse(0.0))
            .fat(Optional.ofNullable(req.fat()).orElse(0.0))
            .date(Optional.ofNullable(req.date()).orElse(LocalDate.now()))
            .build());
    }

    public void deleteMeal(Long id) { repo.deleteById(id); }
}

@Service @RequiredArgsConstructor @Transactional
class WorkoutService {
    private final WorkoutRepository repo;

    public List<Workout> getWorkouts(Long userId) {
        return repo.findByUserIdOrderByDateDesc(userId);
    }

    public Workout addWorkout(WorkoutRequest req) {
        return repo.save(Workout.builder()
            .userId(req.userId()).workoutType(req.workoutType())
            .durationMinutes(req.durationMinutes())
            .caloriesBurned(Optional.ofNullable(req.caloriesBurned()).orElse(0))
            .intensity(Optional.ofNullable(req.intensity()).orElse("moderate"))
            .notes(Optional.ofNullable(req.notes()).orElse(""))
            .date(Optional.ofNullable(req.date()).orElse(LocalDate.now()))
            .build());
    }

    public void deleteWorkout(Long id) { repo.deleteById(id); }
}

@Service @RequiredArgsConstructor @Transactional
class SummaryService {
    private final MealRepository    mealRepo;
    private final WorkoutRepository workoutRepo;

    public SummaryResponse getDailySummary(Long userId, LocalDate date) {
        int    cal     = Optional.ofNullable(mealRepo.sumCaloriesByUserAndDate(userId, date)).orElse(0);
        double protein = Optional.ofNullable(mealRepo.sumProteinByUserAndDate(userId, date)).orElse(0.0);
        double carbs   = Optional.ofNullable(mealRepo.sumCarbsByUserAndDate(userId, date)).orElse(0.0);
        double fat     = Optional.ofNullable(mealRepo.sumFatByUserAndDate(userId, date)).orElse(0.0);
        int    burned  = Optional.ofNullable(workoutRepo.sumCalsBurnedByUserAndDate(userId, date)).orElse(0);
        int    minutes = Optional.ofNullable(workoutRepo.sumMinutesByUserAndDate(userId, date)).orElse(0);

        return new SummaryResponse(
            date,
            new CalorieSummary(cal, burned, cal - burned, 2000),
            new MacroSummary(Math.round(protein * 10) / 10.0,
                             Math.round(carbs   * 10) / 10.0,
                             Math.round(fat     * 10) / 10.0),
            new WorkoutSummary(minutes)
        );
    }

    /** Mifflin-St Jeor TDEE calculator */
    public TdeeResponse calculateTdee(double weightKg, double heightCm, int age,
                                      String gender, String activity, String goal) {
        double bmr = gender.equalsIgnoreCase("female")
            ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
            : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

        double mult = switch (activity.toLowerCase()) {
            case "sedentary"   -> 1.2;
            case "light"       -> 1.375;
            case "active"      -> 1.725;
            case "very_active" -> 1.9;
            default            -> 1.55;
        };
        double tdee = bmr * mult;
        double adj  = switch (goal.toLowerCase()) {
            case "cut"  -> -500;
            case "bulk" -> +300;
            default     ->    0;
        };
        double target  = tdee + adj;
        int proteinG   = (int)(weightKg * 2.2);
        int fatG       = (int)(target * 0.25 / 9);
        int carbsG     = (int)((target - proteinG * 4 - fatG * 9) / 4);

        return new TdeeResponse((int)bmr, (int)tdee, (int)target,
                                new MacroRecommendation(proteinG, fatG, carbsG));
    }
}

// ═══════════════════════════════════════════════════════
//  CONTROLLERS
// ═══════════════════════════════════════════════════════

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
@CrossOrigin("*")
class MealController {
    private final MealService svc;

    @GetMapping
    public ResponseEntity<List<Meal>> list(
        @RequestParam Long userId,
        @RequestParam(required = false) LocalDate date
    ) {
        return ResponseEntity.ok(svc.getMeals(userId, date != null ? date : LocalDate.now()));
    }

    @PostMapping
    public ResponseEntity<Meal> create(@Valid @RequestBody MealRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(svc.addMeal(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        svc.deleteMeal(id);
        return ResponseEntity.noContent().build();
    }
}

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
@CrossOrigin("*")
class WorkoutController {
    private final WorkoutService svc;
    private final WorkoutRepository repo;

    @GetMapping
    public ResponseEntity<List<Workout>> list(@RequestParam Long userId) {
        return ResponseEntity.ok(svc.getWorkouts(userId));
    }

    @PostMapping
    public ResponseEntity<Workout> create(@Valid @RequestBody WorkoutRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(svc.addWorkout(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        svc.deleteWorkout(id);
        return ResponseEntity.noContent().build();
    }
}

@RestController
@RequestMapping("/api/weight")
@RequiredArgsConstructor
@CrossOrigin("*")
class WeightController {
    private final WeightRepository repo;

    @GetMapping
    public ResponseEntity<List<WeightEntry>> list(@RequestParam Long userId) {
        return ResponseEntity.ok(repo.findByUserIdOrderByDateAsc(userId));
    }

    @PostMapping
    public ResponseEntity<WeightEntry> create(@Valid @RequestBody WeightRequest req) {
        WeightEntry entry = WeightEntry.builder()
            .userId(req.userId()).weightKg(req.weightKg())
            .bodyFat(req.bodyFat()).notes(Optional.ofNullable(req.notes()).orElse(""))
            .date(Optional.ofNullable(req.date()).orElse(LocalDate.now()))
            .build();
        return ResponseEntity.status(201).body(repo.save(entry));
    }
}

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@CrossOrigin("*")
class GoalController {
    private final GoalRepository repo;

    @GetMapping
    public ResponseEntity<List<Goal>> list(@RequestParam Long userId) {
        return ResponseEntity.ok(repo.findByUserIdOrderByDeadlineAsc(userId));
    }

    @PostMapping
    public ResponseEntity<Goal> create(@Valid @RequestBody GoalRequest req) {
        Goal g = Goal.builder()
            .userId(req.userId()).name(req.name())
            .icon(Optional.ofNullable(req.icon()).orElse("🎯"))
            .currentValue(Optional.ofNullable(req.currentValue()).orElse(0.0))
            .targetValue(req.targetValue())
            .unit(Optional.ofNullable(req.unit()).orElse(""))
            .deadline(req.deadline()).build();
        return ResponseEntity.status(201).body(repo.save(g));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<Goal> updateProgress(@PathVariable Long id,
                                               @RequestParam Double currentValue) {
        Goal g = repo.findById(id).orElseThrow();
        g.setCurrentValue(currentValue);
        g.setCompleted(currentValue >= g.getTargetValue());
        return ResponseEntity.ok(repo.save(g));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin("*")
class SummaryController {
    private final SummaryService svc;

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> summary(
        @RequestParam Long userId,
        @RequestParam(required = false) LocalDate date
    ) {
        return ResponseEntity.ok(svc.getDailySummary(userId, date != null ? date : LocalDate.now()));
    }

    @GetMapping("/calc/tdee")
    public ResponseEntity<TdeeResponse> tdee(
        @RequestParam double weightKg,
        @RequestParam double heightCm,
        @RequestParam int age,
        @RequestParam(defaultValue = "male") String gender,
        @RequestParam(defaultValue = "moderate") String activity,
        @RequestParam(defaultValue = "maintain") String goal
    ) {
        return ResponseEntity.ok(svc.calculateTdee(weightKg, heightCm, age, gender, activity, goal));
    }
}

/*
 * ─────────────────────────────────────────────────────────────
 *  pom.xml dependencies (Spring Boot 3.x)
 * ─────────────────────────────────────────────────────────────
 *
 * <dependencies>
 *   <dependency>
 *     <groupId>org.springframework.boot</groupId>
 *     <artifactId>spring-boot-starter-web</artifactId>
 *   </dependency>
 *   <dependency>
 *     <groupId>org.springframework.boot</groupId>
 *     <artifactId>spring-boot-starter-data-jpa</artifactId>
 *   </dependency>
 *   <dependency>
 *     <groupId>org.springframework.boot</groupId>
 *     <artifactId>spring-boot-starter-validation</artifactId>
 *   </dependency>
 *   <dependency>
 *     <groupId>com.h2database</groupId>
 *     <artifactId>h2</artifactId>
 *     <scope>runtime</scope>
 *   </dependency>
 *   <dependency>
 *     <groupId>org.projectlombok</groupId>
 *     <artifactId>lombok</artifactId>
 *     <optional>true</optional>
 *   </dependency>
 *   <dependency>
 *     <groupId>org.springdoc</groupId>
 *     <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
 *     <version>2.3.0</version>
 *   </dependency>
 * </dependencies>
 *
 * ─────────────────────────────────────────────────────────────
 *  application.properties
 * ─────────────────────────────────────────────────────────────
 *
 * # Dev H2 in-memory
 * spring.datasource.url=jdbc:h2:mem:fittrack;DB_CLOSE_DELAY=-1
 * spring.jpa.hibernate.ddl-auto=create-drop
 * spring.h2.console.enabled=true
 *
 * # Production MySQL
 * # spring.datasource.url=jdbc:mysql://localhost:3306/fittrack?useSSL=false
 * # spring.datasource.username=root
 * # spring.datasource.password=yourpassword
 * # spring.jpa.hibernate.ddl-auto=update
 * ─────────────────────────────────────────────────────────────
 */
