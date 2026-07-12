package hrms.hrms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Optional;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import hrms.hrms.entity.City;
import hrms.hrms.repository.CityDao;

@SpringBootTest
@ActiveProfiles("test")
@Transactional

public class CityDaoTest {

	@Autowired
	private CityDao cityDao;

	@Test
    void should_save_city_successfully() {
        City city = new City();
        city.setCityName("Istanbul");

        City saved = cityDao.save(city);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCityName()).isEqualTo("Istanbul");
    }

    @Test
    void should_return_empty_when_city_not_exists() {
        Optional<City> result = cityDao.findById(999);

        assertThat(result).isEmpty();
    }

    @Test
    void should_throw_exception_when_duplicate_city_name() {
        City city1 = new City();
        city1.setCityName("Ankara");
        cityDao.saveAndFlush(city1);

        City city2 = new City();
        city2.setCityName("Ankara");

        assertThatThrownBy(() -> {
            cityDao.saveAndFlush(city2);
        });
    }
}
